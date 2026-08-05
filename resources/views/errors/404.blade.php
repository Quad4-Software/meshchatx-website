@php
    $page = 'error';
    $status = 404;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="404" />
@endsection
