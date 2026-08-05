@php
    $page = 'error';
    $status = 403;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="403" />
@endsection
