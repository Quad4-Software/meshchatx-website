@php
    $page = 'error';
    $status = 400;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="400" />
@endsection
